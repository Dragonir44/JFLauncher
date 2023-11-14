// import React from "react";
import { ipcRenderer as ipc } from 'electron'

function NoAuth(): JSX.Element {

  function handleConnect(e): undefined {
    e.disabled = true
    ipc.send('login', {})
  }

  return (
    <>
      <div className="login-page">
        <div className="form">
          <button onClick={handleConnect} id="play">
            Connexion
          </button>
        </div>
      </div>
      <div className="disclaimer">
        <p>
          <b>Warning:</b> This launcher is not finished yet, and is still in development. It is not
          recommended to use this launcher yet.
        </p>
        <p>
          <b>Disclaimer:</b> This launcher is not affiliated with Mojang, the developers of
          Minecraft.
        </p>
      </div>
    </>
  );
}

export default NoAuth;