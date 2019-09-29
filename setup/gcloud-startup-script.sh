#!/usr/bin/env bash
get_metadata() {
curl "http://metadata.google.internal/computeMetadata/v1/instance/attributes/$1?alt=text" -H "Metadata-Flavor: Google"
}

set -e

echo "Getting metadata..."
BRANCH=$(get_metadata BRANCH)
DYN_EMAIL=$(get_metadata DYN_EMAIL)
DYN_USERNAME=$(get_metadata DYN_USERNAME)
DYN_PASSWORD=$(get_metadata DYN_PASSWORD)
export INSTALL_DIR=/usr/local/opensiddur-compiler

echo "Setting up the opensiddur-compiler user..."
useradd -c "client"  client

echo "Downloading prerequisites..."
apt update
export DEBIAN_FRONTEND=noninteractive
apt-get install -yq ddclient nginx python3-certbot-nginx

echo "Obtaining sources..."
mkdir -p /usr/local
cd /usr/local
git clone git://github.com/opensiddur/opensiddur-compiler.git
cd opensiddur-compiler
git checkout ${BRANCH}
export SRC=$(pwd)

chown -R client:client ${INSTALL_DIR}

# get some gcloud metadata:
PROJECT=$(gcloud config get-value project)
INSTANCE_NAME=$(hostname)
ZONE=$(gcloud compute instances list --filter="name=(${INSTANCE_NAME})" --format 'csv[no-heading](zone)')

export DNS_NAME="compiler-feature.jewishliturgy.org"
export DB_DNS_NAME="db-dev.jewishliturgy.org"
# branch-specific environment settings
if [[ $BRANCH == "master" ]];
then
    export DNS_NAME="compiler-prod.jewishliturgy.org"
    export DB_DNS_NAME="db-prod.jewishliturgy.org";
elif [[ $BRANCH == "develop" ]];
then
    export DNS_NAME="compiler-dev.jewishliturgy.org"
    export DB_DNS_NAME="db-dev.jewishliturgy.org";
fi
INSTANCE_BASE=${PROJECT}-app-${BRANCH//\//-}

echo "Installing dynamic DNS updater to update ${DNS_NAME}..."
cat << EOF > /etc/ddclient.conf
## ddclient configuration file
daemon=600
# check every 600 seconds
syslog=yes
# log update msgs to syslog
mail-failure=${DYN_EMAIL} # Mail failed updates to user
pid=/var/run/ddclient.pid
# record PID in file.
ssl=yes
# use HTTPS
## Detect IP with our CheckIP server
use=web, web=checkip.dyndns.com/, web-skip='IP Address'
## DynDNS username and password here
login=${DYN_USERNAME}
password=${DYN_PASSWORD}
## Default options
  protocol=dyndns2
server=members.dyndns.org
## Dyn Standard DNS hosts
custom=yes, ${DNS_NAME}
EOF

echo "Restarting ddclient..."
systemctl restart ddclient

echo "Configure nginx..."
cat conf/nginx.conf.tmpl | envsubst '$DNS_NAME $DB_DNS_NAME $INSTALL_DIR' > /etc/nginx/sites-enabled/opensiddur-compiler.conf

echo "Wait for DNS propagation..."
PUBLIC_IP=$(curl icanhazip.com)
while [[ $(dig +short ${DNS_NAME} @resolver1.opendns.com) != "${PUBLIC_IP}" ]];
do
    echo "Waiting 1 min for ${DNS_NAME} to resolve to ${PUBLIC_IP}..."
    sleep 60;
done

echo "Get an SSL certificate..."
if [[ $BRANCH = feature/* ]];
then
    echo "using staging cert for feature branch $BRANCH"
    CERTBOT_DRY_RUN="--test-cert";
else
    CERTBOT_DRY_RUN="";
fi
certbot --nginx -n --domain ${DNS_NAME} --email ${DYN_EMAIL} --no-eff-email --agree-tos --redirect ${CERTBOT_DRY_RUN}

echo "Scheduling SSL Certificate renewal..."
cat << EOF > /etc/cron.daily/certbot_renewal
#!/bin/sh
certbot renew
EOF
chmod +x /etc/cron.daily/certbot_renewal

echo "Restarting nginx..."
systemctl restart nginx

echo "Stopping prior instances..."
ALL_PRIOR_INSTANCES=$(gcloud compute instances list --filter="status=RUNNING AND name~'${INSTANCE_BASE}'" | \
       sed -n '1!p' | \
       cut -d " " -f 1 | \
       grep -v "${INSTANCE_NAME}" )
if [[ -n "${ALL_PRIOR_INSTANCES}" ]];
then
    gcloud compute instances stop ${ALL_PRIOR_INSTANCES} --zone ${ZONE};
else
    echo "No prior instances found for ${INSTANCE_BASE}";
fi