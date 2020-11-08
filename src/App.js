import { Suspense, useEffect } from "react";
import { BrowserRouter, Redirect, Route, Switch} from 'react-router-dom'
import './index.scss'

import Loading from './components/Loading';
import MeettingRoom from "./pages/MeettingRoom";

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: false,
  video: true
};

function handleSuccess(stream) {
  const video = document.querySelector('video');
  const videoTracks = stream.getVideoTracks();
  console.log('Got stream with constraints:', constraints);
  console.log(`Using video device: ${videoTracks[0].label}`);
  window.stream = stream; // make variable available to browser console
  video.srcObject = stream;
}

function handleError(error) {
  if (error.name === 'ConstraintNotSatisfiedError') {
    const v = constraints.video;
    errorMsg(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
  } else if (error.name === 'PermissionDeniedError') {
    errorMsg('Permissions have not been granted to use your camera and ' +
      'microphone, you need to allow the page access to your devices in ' +
      'order for the demo to work.');
  }
  errorMsg(`getUserMedia error: ${error.name}`, error);
}

function errorMsg(msg, error) {
  // const errorElement = document.querySelector('#errorMsg');
  // errorElement.innerHTML += `<p>${msg}</p>`;
  // if (typeof error !== 'undefined') {
  //   console.error(error);
  // }
}

async function init(e) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    handleSuccess(stream);
    e.target.disabled = true;
  } catch (e) {
    handleError(e);
  }
}
function App() {
  useEffect(() => {
    
    // init()
  }, [])
  return (
    <div className="web-rtc">
      <Suspense fallback={<Loading type={'bars'} color={'white'} />}>
        <BrowserRouter>
          <Switch>
            <Route exact path = "/">
                <Redirect to="/meetting"/> 
            </Route>
            <Route path = "/meetting"  component = {MeettingRoom}/>
          </Switch>
          </BrowserRouter>
      </Suspense>
    </div>
  );
}

export default App;
