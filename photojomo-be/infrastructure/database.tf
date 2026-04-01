# ── Subnet Group ─────────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  count      = var.create_network ? 1 : 0
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.public_a[0].id, aws_subnet.public_b[0].id]

  tags = {
    Name        = "${local.name_prefix}-db-subnet-group"
    Environment = var.environment
  }
}

# ── RDS PostgreSQL ────────────────────────────────────────────────────────────

resource "aws_db_instance" "postgres" {
  count             = var.create_network ? 1 : 0
  identifier        = "${local.name_prefix}-postgres"
  engine            = "postgres"
  engine_version    = "16.3"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main[0].name
  vpc_security_group_ids = [aws_security_group.rds[0].id]

  publicly_accessible       = true
  backup_retention_period   = 7
  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name_prefix}-postgres-final-snapshot"

  deletion_protection = var.environment == "prod" ? true : false

  tags = {
    Name        = "${local.name_prefix}-postgres"
    Environment = var.environment
    Project     = var.project_name
  }
}
