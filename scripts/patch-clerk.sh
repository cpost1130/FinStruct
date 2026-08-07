#!/usr/bin/env bash
# Patch @clerk/tanstack-start to use inline Asset instead of @tanstack/start import
CLERK_FILE="node_modules/@clerk/tanstack-start/dist/client/ClerkProvider.js"
if [ -f "$CLERK_FILE" ]; then
  # Check if patch is needed
  if grep -q "import { Asset } from '@tanstack/start'" "$CLERK_FILE"; then
    sed -i "s|import { Asset } from '@tanstack/start';|const Asset = ({ tag, children, ...rest }) => require('react').createElement(tag, rest, children);|" "$CLERK_FILE"
    sed -i "s|import { useEffect } from 'react';|import { useEffect, createElement } from 'react';|" "$CLERK_FILE"
    echo "Patched ClerkProvider.js"
  else
    echo "ClerkProvider.js already patched"
  fi
fi
