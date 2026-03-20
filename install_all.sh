#!/bin/bash
echo "Blog Install"
npm install


echo "CMS Server Install"
cd cms
npm install

echo "CMS Client Install"
cd client
npm install