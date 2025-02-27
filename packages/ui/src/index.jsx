import React from 'react'
import App from '@/App'
import { store } from '@/store'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@descope/react-sdk'
// style + assets
import '@/assets/scss/style.scss'

// third party
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { SnackbarProvider } from 'notistack'
import ConfirmContextProvider from '@/store/context/ConfirmContextProvider'
import { ReactFlowContext } from '@/store/context/ReactFlowContext'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
    <React.StrictMode>
        <AuthProvider projectId="P2qN8t4mIqaKVihBD18pVybYVukP">
            <Provider store={store}>
                <BrowserRouter>
                    <SnackbarProvider>
                    <ConfirmContextProvider>
                        <ReactFlowContext>
                            <App />
                        </ReactFlowContext>
                    </ConfirmContextProvider>
                </SnackbarProvider>
                </BrowserRouter>
            </Provider>
        </AuthProvider>
    </React.StrictMode>
)
