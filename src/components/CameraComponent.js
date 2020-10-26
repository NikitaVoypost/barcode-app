import React, { useRef, useEffect, useState } from 'react';
import CancelIcon from '@material-ui/icons/Cancel';

import { BrowserBarcodeReader, BrowserDatamatrixCodeReader } from '@zxing/library';

const CameraComponent = ({ }) => {
    const videoRef = useRef(null);
    const buttonRef = useRef(null);
    const selectRef = useRef(null);
    const codePositionRef = useRef(null);
    const deletedCodesRef = useRef([]);
    const codeResultRef = useRef([]);
    const [currentCode, setCurrentCode] = useState('');
    const [currentStream, setCurrentStream] = useState('');

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
        const device = mediaDevices.filter(mediaDevice => mediaDevice.kind === 'videoinput')
        device.forEach(mediaDevice => {
            const option = document.createElement('option');
            option.value = mediaDevice.deviceId;
            const label = mediaDevice.label || `Camera ${count++}`;
            const textNode = document.createTextNode(label);
            option.appendChild(textNode);
            selectRef.current.appendChild(option);
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
                setCurrentStream(stream);
                videoRef.current.srcObject = stream;
                return navigator.mediaDevices.enumerateDevices();
            })
            .then(gotDevices)
            .catch(error => {
                console.error(error);
            });

        let selectedDeviceId;
        const codeReader = new BrowserBarcodeReader();
        codeReader.getVideoInputDevices().then((videoInputDevices) => {

            if (videoInputDevices.length > 1) {
                selectedDeviceId = selectRef.current.value;
            } else {
                selectedDeviceId = videoInputDevices[0].deviceId
            }

            codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result) => {
                if (result && !deletedCodesRef.current.includes(result.text)) {
                    codePositionRef.current.setAttribute('style',
                        `display: block; top: ${result.resultPoints[0].x}px; left:${result.resultPoints[0].x}px; width:${result.resultPoints[1].x - result.resultPoints[0].x}px; height:${(result.resultPoints[1].x - result.resultPoints[0].x) / 1.5}px;`)
                    setCurrentCode(result.text)
                } else {
                    codePositionRef.current.setAttribute('style', 'display: none;')
                }
                if (result && !codeResultRef.current.includes(result.text)) {
                    codeResultRef.current.push(result.text)
                }
            }).catch((err) => {
                console.error(err)
            })
        })
    };

    function handleClickApply() {
        const result = codeResultRef.current.filter(code => !deletedCodesRef.current.includes(code))
        alert(result)
        stopMediaTracks(currentStream)
    }

    function handleClickDelete() {
        deletedCodesRef.current.push(currentCode)
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
                <h1>Camera BARCODE scanner</h1>
            </header>
            <main>
                <div className="controls">
                    <button ref={buttonRef}>Get camera</button>
                    <select ref={selectRef}>
                        <option></option>
                    </select>
                </div>
                <div className="video-wrapper">
                    <video id='video' ref={videoRef} autoPlay playsinline>
                    </video>
                    <div ref={codePositionRef} className='position'>
                        <CancelIcon fontSize='large' className='deleteIcon' onClick={handleClickDelete} />
                    </div>
                </div>
            </main>
            <button className='applyButton' onClick={handleClickApply} >Apply</button>
            <footer>
            </footer>
        </>
    )
}

export default CameraComponent;