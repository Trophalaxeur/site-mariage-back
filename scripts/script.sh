#!/bin/bash
SOURCE=$1
DEST=$2
FILES=`ls $SOURCE`
COUNT=0
rm -rf $DEST
mkdir $DEST
for i in $FILES
do
echo "Processing image $i ..."
/usr/bin/convert -thumbnail 200 $SOURCE/$i $DEST/thumb.$COUNT.jpg
# /usr/bin/convert -thumbnail x50 $SOURCE/$i $DEST/xthumb.$COUNT.jpg
/usr/bin/convert $SOURCE/$i -resize 970x520\> $DEST/$COUNT.jpg
COUNT=$[$COUNT + 1]
done
