package mailchimp

import (
	"bytes"
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	apiKey     string
	audienceID string
	httpClient *http.Client
	baseURL    string
}

func NewClient(apiKey, audienceID string) *Client {
	dc := "us1"
	if parts := strings.Split(apiKey, "-"); len(parts) == 2 {
		dc = parts[1]
	}
	return &Client{
		apiKey:     apiKey,
		audienceID: audienceID,
		httpClient: &http.Client{Timeout: 10 * time.Second},
		baseURL:    fmt.Sprintf("https://%s.api.mailchimp.com/3.0", dc),
	}
}

// SubscribeWithTag upserts a member into the audience and applies a tag.
// If the member already exists their status is left unchanged (status_if_new).
func (c *Client) SubscribeWithTag(email, firstName, lastName, tag string) error {
	hash := emailHash(email)

	member := map[string]interface{}{
		"email_address": strings.ToLower(email),
		"status_if_new": "subscribed",
		"merge_fields": map[string]string{
			"FNAME": firstName,
			"LNAME": lastName,
		},
	}
	memberURL := fmt.Sprintf("%s/lists/%s/members/%s", c.baseURL, c.audienceID, hash)
	if err := c.doRequest("PUT", memberURL, member); err != nil {
		return fmt.Errorf("upserting mailchimp member: %w", err)
	}

	tagPayload := map[string]interface{}{
		"tags": []map[string]string{
			{"name": tag, "status": "active"},
		},
	}
	tagURL := fmt.Sprintf("%s/lists/%s/members/%s/tags", c.baseURL, c.audienceID, hash)
	if err := c.doRequest("POST", tagURL, tagPayload); err != nil {
		return fmt.Errorf("adding mailchimp tag: %w", err)
	}

	return nil
}

func emailHash(email string) string {
	h := md5.New()
	h.Write([]byte(strings.ToLower(email)))
	return fmt.Sprintf("%x", h.Sum(nil))
}

func (c *Client) doRequest(method, url string, body interface{}) error {
	data, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshalling request body: %w", err)
	}

	req, err := http.NewRequest(method, url, bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth("anystring", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("mailchimp API returned %d: %s", resp.StatusCode, respBody)
	}

	return nil
}
