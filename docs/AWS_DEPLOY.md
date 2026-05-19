# AWS deploy test chi phi thap

Kien truc nay toi uu cho moi truong test:

- 1 EC2 `t3.micro` chay nginx + NestJS bang `systemd`.
- 1 RDS PostgreSQL Single-AZ `db.t4g.micro` hoac `db.t3.micro`.
- Khong dung Docker, NAT Gateway, ALB, ECR, CodePipeline de giam chi phi va giam tai cho EC2 micro.
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

Neu deploy bang GitHub-hosted Actions, runner cua GitHub khong dung IP nha ban, nen `admin_ssh_cidr = "YOUR_PUBLIC_IP/32"` se lam workflow khong SSH duoc vao EC2. Cho moi truong test ngan han, dat `admin_ssh_cidr = "0.0.0.0/0"` de GitHub Actions deploy duoc, sau do thu hep lai hoac dung self-hosted runner/VPN neu can chat hon.

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
- `DB_SSL`: workflow tu ghi `true` cho RDS
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

Neu workflow fail o buoc `Upload release to EC2`, kiem tra:

- `SERVER_HOST` dung public IP moi nhat cua EC2 trong Terraform output.
- `SERVER_USER` la `ubuntu`.
- `SERVER_SSH_KEY` la private key, noi dung file `~/.ssh/a25_aws`, khong phai file `.pub`.
- Private key khong dat passphrase vi GitHub Actions chay non-interactive.
- Security group EC2 dang mo port 22 cho IP cua GitHub runner. Neu `admin_ssh_cidr` chi la IP nha ban, GitHub runner se khong SSH duoc. De test nhanh co the tam mo `0.0.0.0/0`, deploy xong nen thu hep lai.

Neu log la `Connection timed out during banner exchange`, port 22 da mo nhung EC2 khong tra SSH banner kip. Neu truoc do tung deploy bang Docker, instance `t3.micro` co the dang qua tai do build/container cu. Cach xu ly nhanh:

```bash
ssh -i ~/.ssh/a25_aws ubuntu@EC2_PUBLIC_IP
sudo pkill -f docker || true
sudo systemctl restart ssh
```

Neu khong SSH duoc tu may ban, vao AWS Console -> EC2 -> Instance state -> Reboot instance, doi 1-2 phut roi rerun workflow. Workflow hien build artifact tren GitHub runner; EC2 chi giai nen file, restart `a25-server` va nginx.

## 5. Seed du lieu test

Neu can seed sau deploy:

```bash
ssh -i ~/.ssh/a25_aws ubuntu@EC2_PUBLIC_IP
cd /opt/a25/server
echo 'DB_SSL="true"' >> .env.production
node dist/database/seeds/seed.js
```

Kiem tra service:

```bash
sudo systemctl status a25-server
sudo journalctl -u a25-server -f
sudo nginx -t
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
