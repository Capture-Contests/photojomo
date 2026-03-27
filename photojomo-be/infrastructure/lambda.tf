# ── IAM Role ──────────────────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_exec" {
  name = "${local.name_prefix}-lambda-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Allows Lambda to write CloudWatch logs and operate inside a VPC
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# ── CloudWatch Log Group ──────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "contact_service" {
  name              = "/aws/lambda/${local.name_prefix}-contact-service"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── Lambda Function: submission-service ──────────────────────────────────────

resource "aws_cloudwatch_log_group" "submission_service" {
  name              = "/aws/lambda/${local.name_prefix}-submission-service"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_lambda_function" "submission_service" {
  function_name = "${local.name_prefix}-submission-service"
  description   = "Creates contestant and submission records"

  s3_bucket        = aws_s3_bucket.artifacts.id
  s3_key           = aws_s3_object.submission_service_zip.key
  source_code_hash = filebase64sha256(var.submission_service_zip_path)

  runtime = "provided.al2023"
  handler = "bootstrap"
  role    = aws_iam_role.lambda_exec.arn

  memory_size = 128
  timeout     = 10

  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ARN = aws_secretsmanager_secret.db_credentials.arn
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.submission_service,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_read_secret,
  ]

  tags = {
    Name        = "${local.name_prefix}-submission-service"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── Lambda Function: payment-intent-service ──────────────────────────────────

resource "aws_cloudwatch_log_group" "payment_intent_service" {
  name              = "/aws/lambda/${local.name_prefix}-payment-intent-service"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_lambda_function" "payment_intent_service" {
  function_name = "${local.name_prefix}-payment-intent-service"
  description   = "Creates Stripe PaymentIntents and returns client secrets"

  s3_bucket        = aws_s3_bucket.artifacts.id
  s3_key           = aws_s3_object.payment_intent_service_zip.key
  source_code_hash = filebase64sha256(var.payment_intent_service_zip_path)

  runtime = "provided.al2023"
  handler = "bootstrap"
  role    = aws_iam_role.lambda_exec.arn

  memory_size = 128
  timeout     = 10

  # No VPC config — this lambda only calls Stripe's external API, no DB access needed.
  # Placing it outside the VPC gives it internet access without a NAT Gateway.

  environment {
    variables = {
      STRIPE_SECRET_KEY = var.stripe_secret_key
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.payment_intent_service,
    aws_iam_role_policy_attachment.lambda_basic,
  ]

  tags = {
    Name        = "${local.name_prefix}-payment-intent-service"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── Lambda Function: stripe-webhook-service ──────────────────────────────────

resource "aws_cloudwatch_log_group" "stripe_webhook_service" {
  name              = "/aws/lambda/${local.name_prefix}-stripe-webhook-service"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_lambda_function" "stripe_webhook_service" {
  function_name = "${local.name_prefix}-stripe-webhook-service"
  description   = "Handles Stripe webhook events and updates payment status"

  s3_bucket        = aws_s3_bucket.artifacts.id
  s3_key           = aws_s3_object.stripe_webhook_service_zip.key
  source_code_hash = filebase64sha256(var.stripe_webhook_service_zip_path)

  runtime = "provided.al2023"
  handler = "bootstrap"
  role    = aws_iam_role.lambda_exec.arn

  memory_size = 128
  timeout     = 10

  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ARN         = aws_secretsmanager_secret.db_credentials.arn
      STRIPE_WEBHOOK_SECRET = var.stripe_webhook_secret
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.stripe_webhook_service,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_read_secret,
  ]

  tags = {
    Name        = "${local.name_prefix}-stripe-webhook-service"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── Lambda Function: contact-service ─────────────────────────────────────────

resource "aws_lambda_function" "contact_service" {
  function_name = "${local.name_prefix}-contact-service"
  description   = "Saves user contact information to PostgreSQL"

  s3_bucket        = aws_s3_bucket.artifacts.id
  s3_key           = aws_s3_object.contact_service_zip.key
  source_code_hash = filebase64sha256(var.contact_service_zip_path)

  runtime = "provided.al2023"
  handler = "bootstrap"
  role    = aws_iam_role.lambda_exec.arn

  memory_size = 128
  timeout     = 10

  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ARN = aws_secretsmanager_secret.db_credentials.arn
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.contact_service,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_read_secret,
  ]

  tags = {
    Name        = "${local.name_prefix}-contact-service"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── Lambda Function: contest-entry-service ────────────────────────────────────

resource "aws_cloudwatch_log_group" "contest_entry_service" {
  name              = "/aws/lambda/${local.name_prefix}-contest-entry-service"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_lambda_function" "contest_entry_service" {
  function_name = "${local.name_prefix}-contest-entry-service"
  description   = "Generates presigned S3 URLs and records contest entries"

  s3_bucket        = aws_s3_bucket.artifacts.id
  s3_key           = aws_s3_object.contest_entry_service_zip.key
  source_code_hash = filebase64sha256(var.contest_entry_service_zip_path)

  runtime = "provided.al2023"
  handler = "bootstrap"
  role    = aws_iam_role.lambda_exec.arn

  memory_size = 128
  timeout     = 10

  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.lambda.id]
  }

  environment {
    variables = {
      DB_SECRET_ARN = aws_secretsmanager_secret.db_credentials.arn
      IMAGES_BUCKET = aws_s3_bucket.contest_images.bucket
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.contest_entry_service,
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_read_secret,
    aws_iam_role_policy_attachment.lambda_write_images,
  ]

  tags = {
    Name        = "${local.name_prefix}-contest-entry-service"
    Environment = var.environment
    Project     = var.project_name
  }
}
