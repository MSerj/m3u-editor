import React from 'react'
import AppBar from '@material-ui/core/AppBar'
import Typography from '@material-ui/core/Typography'
import M3U from './M3U'
import Toolbar from '@material-ui/core/Toolbar'
import IconButton from '@material-ui/core/IconButton'
import GitHubIcon from '@material-ui/icons/GitHub'
import { useStyles } from './styles'

const App = () => {
    const classes = useStyles()

    return (
        <div className="App">
            <main>
                <AppBar position="static">
                    <Toolbar>
                        <Typography variant="h6">m3u-editor</Typography>
                        <IconButton
                            className={classes.goRight}
                            href="https://github.com/MSerj/m3u-editor"
                        >
                            <GitHubIcon />
                        </IconButton>
                    </Toolbar>
                </AppBar>
                <M3U />
            </main>
        </div>
    )
}

export default App
