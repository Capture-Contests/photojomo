# ── DB Secret ─────────────────────────────────────────────────────────────────

resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${local.name_prefix}/db-credentials"
  description = "PostgreSQL credentials for ${local.name_prefix}"

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id

  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = local.db_host
    port     = "5432"
    dbname   = var.db_name
  })
}

# ── Stripe Secret ─────────────────────────────────────────────────────────────

resource "aws_secretsmanager_secret" "stripe_credentials" {
  name        = "${local.name_prefix}/stripe"
  description = "Stripe API credentials for ${local.name_prefix}"
  tags        = { Environment = var.environment, Project = var.project_name }
}

resource "aws_secretsmanager_secret_version" "stripe_credentials" {
  secret_id = aws_secretsmanager_secret.stripe_credentials.id
  secret_string = jsonencode({
    secretKey     = var.stripe_secret_key
    webhookSecret = var.stripe_webhook_secret
  })
}

# ── PayPal Secret ─────────────────────────────────────────────────────────────

resource "aws_secretsmanager_secret" "paypal_credentials" {
  name        = "${local.name_prefix}/paypal"
  description = "PayPal API credentials for ${local.name_prefix}"
  tags        = { Environment = var.environment, Project = var.project_name }
}

resource "aws_secretsmanager_secret_version" "paypal_credentials" {
  secret_id = aws_secretsmanager_secret.paypal_credentials.id
  secret_string = jsonencode({
    clientId     = var.paypal_client_id
    clientSecret = var.paypal_client_secret
    webhookId    = var.paypal_webhook_id
  })
}

# ── IAM: allow Lambda to read the secret ─────────────────────────────────────

resource "aws_iam_policy" "lambda_read_secret" {
  name        = "${local.name_prefix}-lambda-read-secret"
  description = "Allow Lambda to read the DB credentials secret"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["secretsmanager:GetSecretValue"]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn,
          aws_secretsmanager_secret.stripe_credentials.arn,
          aws_secretsmanager_secret.paypal_credentials.arn,
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_read_secret" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = aws_iam_policy.lambda_read_secret.arn
}

# ── VPC Endpoint: Secrets Manager (keeps traffic off the public internet) ─────

resource "aws_security_group" "vpc_endpoints" {
  count       = var.create_network ? 1 : 0
  name        = "${local.name_prefix}-vpc-endpoints-sg"
  description = "Security group for VPC interface endpoints"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    description     = "HTTPS from Lambda"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda[0].id]
  }

  tags = {
    Name        = "${local.name_prefix}-vpc-endpoints-sg"
    Environment = var.environment
  }
}

resource "aws_vpc_endpoint" "secretsmanager" {
  count               = var.create_network ? 1 : 0
  vpc_id              = aws_vpc.main[0].id
  service_name        = "com.amazonaws.${var.aws_region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = [aws_subnet.private_a[0].id, aws_subnet.private_b[0].id]
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = {
    Name        = "${local.name_prefix}-secretsmanager-endpoint"
    Environment = var.environment
  }
}
