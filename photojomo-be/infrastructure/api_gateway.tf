# ── HTTP API (v2) ─────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "Photojomo HTTP API"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }

  tags = {
    Name        = "${local.name_prefix}-api"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── Stage ─────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      sourceIp       = "$context.identity.sourceIp"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      durationMs     = "$context.integrationLatency"
    })
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${local.name_prefix}-api"
  retention_in_days = 30

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── Submission Service Integration ───────────────────────────────────────────

resource "aws_apigatewayv2_integration" "submission_service" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.submission_service.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "create_submission" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /submissions"
  target    = "integrations/${aws_apigatewayv2_integration.submission_service.id}"
}

resource "aws_lambda_permission" "submission_service_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submission_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ── Contest Entry Service Integration ────────────────────────────────────────

resource "aws_apigatewayv2_integration" "contest_entry_service" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.contest_entry_service.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "create_contest_entry" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /contest-entries/presigned-urls"
  target    = "integrations/${aws_apigatewayv2_integration.contest_entry_service.id}"
}

resource "aws_lambda_permission" "contest_entry_service_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.contest_entry_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ── Payment Intent Service Integration ───────────────────────────────────────

resource "aws_apigatewayv2_integration" "payment_intent_service" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.payment_intent_service.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "create_payment_intent" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /payment-intents"
  target    = "integrations/${aws_apigatewayv2_integration.payment_intent_service.id}"
}

resource "aws_lambda_permission" "payment_intent_service_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_intent_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ── Stripe Webhook Service Integration ───────────────────────────────────────

resource "aws_apigatewayv2_integration" "stripe_webhook_service" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.stripe_webhook_service.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "stripe_webhook" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /webhooks/stripe"
  target    = "integrations/${aws_apigatewayv2_integration.stripe_webhook_service.id}"
}

resource "aws_lambda_permission" "stripe_webhook_service_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.stripe_webhook_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# ── Contact Service Integration ───────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "contact_service" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.contact_service.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "save_contact" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /contacts"
  target    = "integrations/${aws_apigatewayv2_integration.contact_service.id}"
}

# ── Permission: API Gateway → Lambda ─────────────────────────────────────────

resource "aws_lambda_permission" "contact_service_apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.contact_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
