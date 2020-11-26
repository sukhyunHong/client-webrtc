import { Suspense } from "react";
import { BrowserRouter, Redirect, Route, Switch} from 'react-router-dom'
import './index.scss'

import Loading from './components/Loading';
import MeettingRoom from "./pages/MeettingRoom";
import Alert from "./components/Alert";
function App() {
  return (
    <div className="web-rtc">
      <Suspense fallback={<Loading type={'bars'} color={'white'} />}>
        <BrowserRouter>
          <Switch>
            <Route exact path = "/">
                <Redirect to="/meetting"/> 
            </Route>
            <Route path = "/meetting"  component = {MeettingRoom}/>
            <Route path = "/alert"  component = {Alert}/>
          </Switch>
          </BrowserRouter>
      </Suspense>
    </div>
  );
}

export default App;
