#!/usr/bin/env bash
# PRISMA STREAM - One-Click Launch Script
set -e

cd "$(dirname "$0")"
echo "Initializing Prisma Stream — Geometric Decision Tree Synthesizer..."
python3 server.py 8000
