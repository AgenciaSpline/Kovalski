#!/bin/bash
cd /root/projeto/crm-eleitoral
npx prisma db push 2>&1
npx prisma generate 2>&1
