#!/bin/bash
NAME=$1
CATEGORY=$2
[ -z "$CATEGORY" ] && CATEGORY='components'
MAKESPACE=$(sed 's/-/ /g' <<< $NAME)
TITLE="$(tr '[:lower:]' '[:upper:]' <<< ${MAKESPACE:0:1})${MAKESPACE:1}"
NAMESPACE=$(sed 's/ //g' <<< $TITLE)

mkdir -p $CATEGORY/$NAME
cp -a _block-base/. $CATEGORY/$NAME
cd $CATEGORY/$NAME
sed -i '' "s/dummy-name/$NAME/g" block.json
sed -i '' "s/Dummy_Title/$TITLE/g" block.json
sed -i '' "s/Dummy_Title/$TITLE/g" template.php
sed -i '' "s/DummyNamespace/$NAMESPACE/g" block.json
sed -i '' "s/DummyNamespace/$NAMESPACE/g" init.php
sed -i '' "s/dummyCategory/$CATEGORY/g" block.json

# usage:
# sh make.sh <block-name> <category>
# e.g. sh make.sh test-block components