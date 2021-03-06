import indexContents from './src/public/index.html'
import newApp from './src/controllers/AppController'
import express from 'express'
import * as fs from "fs"
import * as path from "path"

let layout = indexContents
let layoutFile = path.normalize('/ui/index.html')
if (fs.existsSync(layoutFile)) {
    layout = fs.readFileSync(layoutFile, 'utf8')
}

let renderer = require('vue-server-renderer').createRenderer()

let server = express()
server.use('/assets', express.static(
    './dist/assets'
))

server.get('/favicon.ico', (request: express.Request, response: express.Response) => {
    response.status(204).send()
})

server.get('*', async (request: express.Request, response: express.Response) => {

    let modLayout = layout
    let noscript = request.header("x-dotvue-noscript")
    if (typeof (noscript) != "undefined" && noscript == "true") {
        modLayout = layout.replace('<script src="/assets/bundle.js"></script>', '')
    }

    let app = newApp(request.url);
    await app.initLoad;

    renderer.renderToString(app.vueComponent, (error: any, html: any) => {
        if (error) {
            console.error(error)
            return response
                .status(500)
                .send('Server Error')
        }
        if (typeof (noscript) != "undefined" && noscript == "true") {
            modLayout = modLayout.replace('<!--DOTVUE_INITIAL_DATA-->', '')
        } else {
            modLayout = modLayout.replace('<!--DOTVUE_INITIAL_DATA-->', '<script>window.DotvueInitialData = ' + JSON.stringify(app.ssrData) + '</script>')
        }
        response.send(modLayout.replace('<div id="app"></div>', html))
    })

})

// Listen on port 4000
server.listen(4000, '0.0.0.0', function (error: any) {
    if (error) throw error
    console.log('Server is running at 0.0.0.0:4000')
})
