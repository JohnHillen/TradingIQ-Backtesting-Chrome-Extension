#!/bin/bash

EXT_NAME="tradingIQ-Extension"


if [ -f ./${EXT_NAME}.zip ]; then
  rm ./${EXT_NAME}.zip
fi

if [ -d ./${EXT_NAME} ]; then
  rm -r ./${EXT_NAME}
fi
7z a -r ${EXT_NAME}.zip content_scripts/* fonts/* images/* lib/* popup/* manifest.json page-context.js
