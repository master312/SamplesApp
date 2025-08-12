#!/bin/sh
AMS_DIR=~/softwares/ant-media-server
mvn clean install -DskipTests -Dgpg.skip=true
OUT=$?

if [ $OUT -ne 0 ]; then
    exit $OUT
fi

rm -r $AMS_DIR/webapps/SamplesApp
cp -r target/SamplesApp/* $AMS_DIR/webapps/SamplesApp
cp target/SamplesApp.war $AMS_DIR/webapps

OUT=$?g

if [ $OUT -ne 0 ]; then
    exit $OUT
fi
