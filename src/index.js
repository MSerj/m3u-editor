import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import App from './App'
import CssBaseline from '@material-ui/core/CssBaseline'
import theme from './theme'
import { ThemeProvider } from '@material-ui/core/styles'

ReactDOM.render(
    <React.StrictMode>
        <CssBaseline />
        <ThemeProvider theme={theme}>
            <App />
        </ThemeProvider>
    </React.StrictMode>,
    document.getElementById('root')
)
