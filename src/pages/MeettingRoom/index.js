import React from "react"
import { Route, Switch, useRouteMatch } from "react-router-dom"
import CreateRoom from "../CreateRoom"
import Room from "./pages/Room"

function MeettingRoom(props) {
  const match = useRouteMatch()
  return (
    <Switch>
      <Route exact path={match.url} component={CreateRoom} />
      <Route exact path={`${match.url}/open`} component={Room} />
    </Switch>
  )
}

export default MeettingRoom
