import React, { useRef, useEffect } from 'react';

import { BrowserBarcodeReader } from '@zxing/library';

const CameraComponent = ({ }) => {
    const videoRef = useRef();
    const buttonRef = useRef(null);
    const selectRef = useRef(null);
    let currentStream;
    let codeResult = [];

    function stopMediaTracks(stream) {
        if (stream) {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        }
    }

    function gotDevices(mediaDevices) {
        selectRef.current.innerHTML = '';
        selectRef.current.appendChild(document.createElement('option'));
        let count = 1;
        mediaDevices.forEach(mediaDevice => {
            if (mediaDevice.kind === 'videoinput') {
                const option = document.createElement('option');
                option.value = mediaDevice.deviceId;
                const label = mediaDevice.label || `Camera ${count++}`;
                const textNode = document.createTextNode(label);
                option.appendChild(textNode);
                selectRef.current.appendChild(option);
            }
        })
    };

    function gotStream() {
        if (typeof currentStream !== 'undefined') {
            stopMediaTracks(currentStream);
        }
        const videoConstraints = {};
        if (selectRef.current.value === '') {
            videoConstraints.facingMode = 'environment';
        } else {
            videoConstraints.deviceId = { exact: selectRef.current.value };
        }
        const constraints = {
            video: videoConstraints,
            audio: false
        };

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(stream => {
                currentStream = stream;
                videoRef.current.srcObject = stream;
                return navigator.mediaDevices.enumerateDevices();
            })
            .then(gotDevices)
            .catch(error => {
                console.error(error);
            });

        let selectedDeviceId;
        const codeReader = new BrowserBarcodeReader()
        codeReader.getVideoInputDevices().then((videoInputDevices) => {

            if (videoInputDevices.length > 1) {
                selectedDeviceId = selectRef.current.value;
            } else {
                selectedDeviceId = videoInputDevices[0].deviceId
            }

            codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result) => {
                if (result && !codeResult.includes(result.text)) {
                    codeResult.push(result.text)
                }
            }).catch((err) => {
                console.error(err)
            })
        })
    };

    function handleClick() {
        alert(codeResult)
        stopMediaTracks(currentStream)
    }

    useEffect(() => {
        if (buttonRef && videoRef) {
            buttonRef.current.addEventListener('click', gotStream)
        }
    }, [buttonRef, videoRef, gotStream])

    useEffect(() => {
        if (selectRef) {
            navigator.mediaDevices.enumerateDevices().then(gotDevices);
        }
    }, [selectRef, gotDevices])

    return (
        <>
            <header>
                <h1>Camera fun</h1>
            </header>
            <main>
                <div className="controls">
                    <button ref={buttonRef}>Get camera</button>
                    <select ref={selectRef} id='select'>
                        <option></option>
                    </select>
                </div>
                <video id='video' ref={videoRef} autoPlay playsinline></video>
            </main>
            <button onClick={handleClick}>Apply</button>
            <footer>
            </footer>
        </>
    )
}

export default CameraComponent;