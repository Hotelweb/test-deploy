# AWS deploy test chi phi thap

Kien truc nay toi uu cho moi truong test:

- 1 EC2 `t3.micro` chay Docker Compose: `web` nginx + `server` NestJS.
- 1 RDS PostgreSQL Single-AZ `db.t4g.micro` hoac `db.t3.micro`.
- Khong dung NAT Gateway, ALB, ECR, CodePipeline de giam chi phi.
- Web/API chay qua HTTP bang public IP cua EC2. Khi co domain, co the them HTTPS sau.

Theo tai lieu AWS hien tai, RDS Free Tier co 750 gio/thang cho Single-AZ `db.t3.micro`/`db.t4g.micro` voi PostgreSQL. EC2 Free Tier phu thuoc thoi diem tao account va loai instance duoc danh dau eligible trong account cua ban. Hay bat Billing Alert truoc khi deploy.

## 1. Chuan bi local

Can cai:

- Terraform >= 1.6
- AWS CLI da `aws configure`
- GitHub repo chua code nay
- SSH key rieng cho EC2

Tao SSH key:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/a25_aws -C a25-aws
```

Lay public IP cua may ban de khoa SSH:

```bash
curl https://checkip.amazonaws.com
```

Tao file `infra/aws/terraform.tfvars` tu file mau:

```hcl
aws_region          = "ap-southeast-1"
project_name        = "a25-test"
admin_ssh_cidr      = "YOUR_PUBLIC_IP/32"
ssh_public_key_path = "~/.ssh/a25_aws.pub"
```

## 2. Provision AWS bang Terraform

```bash
cd infra/aws
terraform init
terraform plan
terraform apply
```

Lay output:

```bash
terraform output app_url
terraform output app_public_ip
terraform output db_host
terraform output db_password
```

`db_password` la sensitive output, can chay:

```bash
terraform output -raw db_password
```

Luu y: Terraform state co chua mat khau RDS. Khong commit file `*.tfstate`.

## 3. Tao GitHub Secrets

Vao GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret.

Bat buoc:

- `SERVER_HOST`: output `app_public_ip`
- `SERVER_USER`: `ubuntu`
- `SERVER_SSH_KEY`: noi dung private key `~/.ssh/a25_aws`
- `DB_HOST`: output `db_host`
- `DB_PORT`: `5432`
- `DB_USERNAME`: output `db_username`, mac dinh `a25admin`
- `DB_PASSWORD`: output `db_password`
- `DB_NAME`: output `db_name`, mac dinh `a25_db`
- `JWT_SECRET`: chuoi random dai, vi du `openssl rand -hex 32`

Tuy chon:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `GOOGLE_TRANSLATE_API_KEY`
- `OPENAI_API_KEY`
- `DEEPL_API_KEY`
- `SYSTEM_ADMIN_EMAIL`
- `SYSTEM_ADMIN_PASSWORD`
- `SYSTEM_ADMIN_NAME`

## 4. Deploy app

Push len branch `main` hoac vao GitHub Actions -> `Deploy to AWS test` -> Run workflow.

Sau khi workflow xong, mo:

```text
http://EC2_PUBLIC_IP
http://EC2_PUBLIC_IP/api/docs
```

## 5. Seed du lieu test

Neu can seed sau deploy:

```bash
ssh -i ~/.ssh/a25_aws ubuntu@EC2_PUBLIC_IP
cd /opt/a25/app
docker compose -f docker-compose.aws.yml exec server pnpm run seed
```

## 6. Huy tai nguyen de khong ton tien

Khi test xong:

```bash
cd infra/aws
terraform destroy
```

## Luu y chi phi

- Khong tao NAT Gateway hoac Load Balancer cho moi truong test nay.
- RDS de `backup_retention_period = 0`, Single-AZ, 20GB.
- EC2 mo port 80 cho tester, port 22 chi mo cho IP cua ban.
- Neu account cua ban theo Free Tier credit moi, chi phi se tru vao credit. Neu account cu, hay kiem tra thang Free Tier con hieu luc.
