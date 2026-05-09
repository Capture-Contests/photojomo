package handler

const officialContestID = "con-f3a04fa9-f728-44af-a1f9-39f1b9a59776"

// officialContestCategoryTags maps category names to their PC- Mailchimp tags
// for the Official Capture Caribbean contest.
var officialContestCategoryTags = map[string]string{
	"General":           "PC - General Contest",
	"Emerging Creator":  "PC - Emerging Creator Contest",
	"College Creator":   "PC - College Creator Contest",
	"Master Your Craft": "PC - Master Your Craft",
}

// mailchimpTags returns the Mailchimp tags to apply for a given contest and category.
// For the Official Contest, returns the PC- category tag plus PC - Entry Under Review.
// For all other contests (e.g. First Wave), returns the legacy "{Category} Contest" tag.
func mailchimpTags(contestID, categoryName string) []string {
	if contestID == officialContestID {
		tag, ok := officialContestCategoryTags[categoryName]
		if !ok {
			tag = "PC - " + categoryName
		}
		return []string{tag, "PC - Entry Under Review"}
	}
	return []string{categoryName + " Contest"}
}
