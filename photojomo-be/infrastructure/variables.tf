variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "photojomo"
}

# ── Network / Database ────────────────────────────────────────────────────────

variable "create_network" {
  description = "Create VPC, subnets, and RDS. Set false to reuse an existing DB via db_host_override."
  type        = bool
  default     = true
}

variable "db_host_override" {
  description = "Existing DB host to use when create_network = false"
  type        = string
  default     = ""
}

# ── Database ──────────────────────────────────────────────────────────────────

variable "db_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "photojomo"
}

variable "db_username" {
  description = "Master username for the RDS instance"
  type        = string
  default     = "photojomo_admin"
}

variable "db_password" {
  description = "Master password for the RDS instance"
  type        = string
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

# ── Lambda ────────────────────────────────────────────────────────────────────

variable "contact_service_zip_path" {
  description = "Local path to the contact-service Go binary zip"
  type        = string
  default     = "../dist/contact.zip"
}

variable "submission_service_zip_path" {
  description = "Local path to the submission-service Go binary zip"
  type        = string
  default     = "../dist/submission.zip"
}

variable "contest_entry_service_zip_path" {
  description = "Local path to the contest-entry-service Go binary zip"
  type        = string
  default     = "../dist/contest-entry.zip"
}

variable "stripe_webhook_service_zip_path" {
  description = "Local path to the stripe-webhook-service Go binary zip"
  type        = string
  default     = "../dist/stripe-webhook.zip"
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret (whsec_...)"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key (sk_test_... or sk_live_...)"
  type        = string
  sensitive   = true
}

variable "payment_intent_service_zip_path" {
  description = "Local path to the payment-intent-service Go binary zip"
  type        = string
  default     = "../dist/payment-intent.zip"
}

variable "paypal_order_service_zip_path" {
  description = "Local path to the paypal-order-service Go binary zip"
  type        = string
  default     = "../dist/paypal-order.zip"
}

variable "paypal_capture_service_zip_path" {
  description = "Local path to the paypal-capture-service Go binary zip"
  type        = string
  default     = "../dist/paypal-capture.zip"
}

variable "paypal_client_id" {
  description = "PayPal client ID"
  type        = string
}

variable "paypal_client_secret" {
  description = "PayPal client secret"
  type        = string
  sensitive   = true
}

variable "paypal_webhook_service_zip_path" {
  description = "Local path to the paypal-webhook-service Go binary zip"
  type        = string
  default     = "../dist/paypal-webhook.zip"
}

variable "paypal_webhook_id" {
  description = "PayPal webhook ID from the PayPal developer dashboard"
  type        = string
}
