#!/bin/bash

EXT_NAME="tradingIQ-Extension"


if [ -f ./${EXT_NAME}.zip ]; then
  rm ./${EXT_NAME}.zip
fi

if [ -d ./${EXT_NAME} ]; then
  rm -r ./${EXT_NAME}
fi
7z a -r ${EXT_NAME}.zip content_scripts/* images/* popup/* manifest.json background.js
7z x ${EXT_NAME}.zip -o${EXT_NAME}