#!/bin/bash -e
# We need bash instead of sh because of
# https://bugs.launchpad.net/ubuntu/+source/dash/+bug/608894

# Pinoccio firmware build script
#
# Copyright (C) 2014 Matthijs Kooijman <matthijs@stdin.nl>
#
# Permission is hereby granted, free of charge, to any person
# obtaining a copy of this software and associated documentation files
# (the "Software"), to deal in the Software without restriction,
# including without limitation the rights to use, copy, modify, merge,
# publish, distribute, sublicense, and/or sell copies of the Software,
# and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
# BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

# To build the bootstrap sketch, run ./build.sh
# To upload it, run ./build.sh --upload

# Below, a number of variables are defined, that might need tweaking for
# your system.
#
# In particular, if the "arduino" command is not available
# in your system PATH, you'll need to set the ARDUINO variable to point
# to the arduino command.Note that on MacOS X, the main executable is
# Arduino.app/Contents/MacOS/JavaApplicationStub instead of arduino.
#
# To change these variables, you can create a file called
# build.sh.local that assigns them (that file will be included by this
# script).

BUILDDIR=`pwd`

echo "buildir "$BUILDDIR

cd $FIRMWARE
if [ "$FIRMWARE" == "" ]; then
  cd $(dirname $0)
fi

# These typically need changing

if [ "$ARDUINO" == "" ]; then
  ARDUINO=arduino
fi

if [ "$BOARD" == "" ]; then
  BOARD=pinoccio:avr:pinoccio
fi

if [ "$PORT" == "" ]; then
  PORT=/dev/ttyACM0
fi

# Variables below should typically not be changed.

# File to read/write preferences from {must be an absolute path until
# PR #2000 is merged}. This file _will_ be deleted after the build!
PREF_FILE=$BUILDDIR/preferences.txt
BUILD_DIR=$BUILDDIR/build
LIB_PINOCCIO=libraries/pinoccio

# READING sketch from environment by default
if [ "$SKETCH" == "" ]; then
  SKETCH=${LIB_PINOCCIO}/examples/Bootstrap/Bootstrap.ino
fi


echo $SKETCH > $BUILDDIR/sketch.txt

SKETCHDIR=$(dirname $SKETCH)

VERSION_H=${LIB_PINOCCIO}/examples/Bootstrap/version.h

if [ ! -f $SKETCHDIR"/version.h" ]; then
  cp $VERSION_H $SKETCHDIR"/version.h"
  VERSION_H=$SKETCHDIR"/version.h"  
else
  VERSION_H=$SKETCHDIR"/version.h"
fi


# TODO: Once https://github.com/arduino/Arduino/pull/2000 is merged, we
# can use --no-save-prefs to prevent writing out a preferences file.
ARDUINO_OPTIONS="--preferences-file ${PREF_FILE} --board ${BOARD} --port ${PORT} --pref build.path=${BUILD_DIR}"

# Include build.sh.local, so any options above can be overridden
if [ -f build.sh.local ]; then
	. ./build.sh.local
fi

usage() {
	echo "Usage: $0 [-h|--help] [--upload] [-v|--verbose]"
}

ACTION=--verify
while [ $# -gt 0 ]; do
	case "$1" in
		--upload)
			ACTION=--upload
			;;
		--help|-h)
			usage
			exit 0
			;;
		--verbose|-v)
			ARDUINO_OPTIONS="${ARDUINO_OPTIONS} --verbose"
			;;
		*)
			usage
			exit 1
			;;
	esac
	shift
done

cleanup() {
	#rm -f "${PREF_FILE}"
	#cd ${LIB_PINOCCIO} && git checkout ${VERSION_H#${LIB_PINOCCIO}/
  echo "cleanup"
}

detect_version() {
	# Detect the version numbers and write to version.h
	SKETCH_NAME=`basename $SKETCH | sed -e "s/\.ino//"`
	SKETCH_BUILD=$(git describe --tags --exact-match --dirty 2>/dev/null | grep -v -e -dirty || true)
	if [ -z "${SKETCH_BUILD}" ]; then
		SKETCH_BUILD=-1
	fi
	SKETCH_REVISION=$(git describe --tags --long --always --dirty 2>/dev/null)

	echo "#define SKETCH_NAME \"${SKETCH_NAME}\"" > ${VERSION_H}
	echo "#define SKETCH_BUILD ${SKETCH_BUILD}" >> ${VERSION_H}
	echo "#define SKETCH_REVISION \"${SKETCH_REVISION}\"" >> ${VERSION_H}
	echo "${SKETCH_NAME} build ${SKETCH_BUILD} (rev ${SKETCH_REVISION})"
}

# Run the cleanup function when we exit for any reason (including normal
# termination)
trap cleanup EXIT

# We can't set this through --pref, since those only take effect
# _after_ loading stuff from the sketchbook
echo "sketchbook.path=$(pwd)" > "${PREF_FILE}"

echo "Detecting version..."
detect_version

# Until PR #2000 is merged, we'll have to manually create this
# directory
mkdir -p ${BUILD_DIR}

echo "Building/uploading..."
# Run the actual Arduino IDE command
# Make the sketch filename absolute until
# https://github.com/arduino/Arduino/issues/1493 is fixed on OSX too.

echo "${ARDUINO} ${ACTION} ${ARDUINO_OPTIONS} ${SKETCH}"
${ARDUINO} ${ACTION} ${ARDUINO_OPTIONS} ${SKETCH}

# Put the build result in the current directory
cp $BUILD_DIR/`basename $SKETCHDIR`.cpp.hex  $BUILDDIR/`basename $SKETCHDIR`.hex

echo "Done!"
