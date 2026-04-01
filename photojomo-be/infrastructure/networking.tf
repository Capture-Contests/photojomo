locals {
  name_prefix = "${var.project_name}-${var.environment}"
  db_host     = var.db_host_override != "" ? var.db_host_override : (var.create_network ? aws_db_instance.postgres[0].address : "")
}

# ── VPC ───────────────────────────────────────────────────────────────────────

resource "aws_vpc" "main" {
  count                = var.create_network ? 1 : 0
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "${local.name_prefix}-vpc"
    Environment = var.environment
    Project     = var.project_name
  }
}

# ── Internet Gateway ──────────────────────────────────────────────────────────

resource "aws_internet_gateway" "main" {
  count  = var.create_network ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  tags = {
    Name        = "${local.name_prefix}-igw"
    Environment = var.environment
  }
}

# ── Public Subnets (RDS) ──────────────────────────────────────────────────────

resource "aws_subnet" "public_a" {
  count             = var.create_network ? 1 : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name        = "${local.name_prefix}-public-a"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_b" {
  count             = var.create_network ? 1 : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name        = "${local.name_prefix}-public-b"
    Environment = var.environment
  }
}

# ── Route Table: Public ───────────────────────────────────────────────────────

resource "aws_route_table" "public" {
  count  = var.create_network ? 1 : 0
  vpc_id = aws_vpc.main[0].id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }

  tags = {
    Name        = "${local.name_prefix}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public_a" {
  count          = var.create_network ? 1 : 0
  subnet_id      = aws_subnet.public_a[0].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_route_table_association" "public_b" {
  count          = var.create_network ? 1 : 0
  subnet_id      = aws_subnet.public_b[0].id
  route_table_id = aws_route_table.public[0].id
}

# ── Private Subnets (Lambda) ──────────────────────────────────────────────────

resource "aws_subnet" "private_a" {
  count             = var.create_network ? 1 : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "${var.aws_region}a"

  tags = {
    Name        = "${local.name_prefix}-private-a"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_b" {
  count             = var.create_network ? 1 : 0
  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"

  tags = {
    Name        = "${local.name_prefix}-private-b"
    Environment = var.environment
  }
}

# ── Security Group: Lambda ────────────────────────────────────────────────────

resource "aws_security_group" "lambda" {
  count       = var.create_network ? 1 : 0
  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main[0].id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.name_prefix}-lambda-sg"
    Environment = var.environment
  }
}

# ── Security Group: RDS ───────────────────────────────────────────────────────

resource "aws_security_group" "rds" {
  count       = var.create_network ? 1 : 0
  name        = "${local.name_prefix}-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = aws_vpc.main[0].id

  ingress {
    description     = "PostgreSQL from Lambda"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda[0].id]
  }

  ingress {
    description = "PostgreSQL public access"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${local.name_prefix}-rds-sg"
    Environment = var.environment
  }
}
