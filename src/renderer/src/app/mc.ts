import { Client, IUser } from 'minecraft-launcher-core'
import { Auth } from 'msmc'
import Store from 'electron-store'
import { Xbox } from 'msmc/types'

const store = new Store()

export const getUserDetails = async (): Promise<Xbox> => {
  const userDetails: Xbox = store.get('userDetails') as Xbox
  if (userDetails) {
    const auth: Auth = new Auth('select_account')
    const result: Xbox = await auth.refresh(userDetails.msToken.refresh_token)
    if (result) {
      return result
    }
  } else {
    const auth = new Auth('select_account')
    const xboxManager = await auth.launch('raw')

    store.set('userDetails', xboxManager)

    return xboxManager
  }
  throw new Error('Unable to get user details')
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const launch = async () => {
  const client = new Client()

  const options = {
    clientPackage: '',
    // For production launchers, I recommend not passing
    // the getAuth function through the authorization field and instead
    // handling authentication outside before you initialize
    // MCLC so you can handle auth based errors and validation!
    authorization: (await getUserDetails()) as unknown as IUser,
    root: './minecraft',
    version: {
      number: '1.16.5',
      type: 'release'
    },
    memory: {
      max: '6G',
      min: '4G'
    }
  }

  client
    .launch(options)
    .then(() => console.log('done'))
    .catch((err: Error) => console.log(err))
}