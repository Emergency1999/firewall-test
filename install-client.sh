#!/bin/bash

apt-get update
apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

cp fw-test.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable fw-test
systemctl start fw-test
