import { Suspense } from "react"
import { Provider } from "react-redux"
import { configStore, getHistory } from "./store/config"
import { ConnectedRouter } from "connected-react-router"
import "./index.scss"

import Loading from "./components/Loading"
import MeettingRoom from "./pages/MeettingRoom"
import Alert from "./components/Alert"
import RoutesComponent from "./routes/RoutesComponent"

const store = configStore()
const history = getHistory()

function App() {
  return (
    <div className="web-rtc">
      <Suspense fallback={<Loading type={"bars"} color={"white"} />}>
        <Provider store={store}>
          {/* <BrowserRouter> */}
          <ConnectedRouter history={getHistory()}>
            <RoutesComponent />
          </ConnectedRouter>
          {/* <Switch>
              <Route exact path = "/">
                  <Redirect to="/meetting"/> 
              </Route>
              <Route path = "/meetting"  component = {MeettingRoom}/>
              <Route path = "/alert"  component = {Alert}/>
            </Switch>
            </BrowserRouter> */}
        </Provider>
      </Suspense>
    </div>
  )
}

export default App
