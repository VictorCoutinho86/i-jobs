require('dotenv-extended').load();
const builder = require('botbuilder');
const restify = require('restify');
const cognitive = require('botbuilder-cognitiveservices');
const server = restify.createServer();
const request = require('request')
const port = process.env.port || 3978;

const url_busca = 'http://localhost:5000/api/v1/job/';


server.listen(port, () => {
    console.log(`Servidor rodando em ${server.url}`)
});


const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
})

const bot = new builder.UniversalBot(connector)

bot.set('storage', new builder.MemoryBotStorage())
server.post('/api/messages', connector.listen())

const luis = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL)


const intents = new builder.IntentDialog({
    recognizers: [luis]
})

intents.onDefault((session, args) =>{
    console.log(JSON.stringify(args))
    session.send('Desculpe, não entendi sua solicitação!')
})

intents.matches('oportunidades', (session, args, next)=>{
    console.log(JSON.stringify(args))
    const funcao = builder.EntityRecognizer.findAllEntities(args.entities, 'funcao').map(m => m.entity).join('+')
    if(funcao){
        const endpoint = `${url_busca}${funcao}`
        session.send('Aguarde enquanto busco as oportunidades.')
        request(endpoint, (error, response, body) => {
            if(error || !body)
                return session.send('Ocorreu algum erro, tente novamente mais tarde.')
            const vagas = JSON.parse(body);
            console.log(JSON.stringify(body))
            for(vaga in vagas){
                session.send(vagas.map(m => `${m.titulo} \n${m.localidade} \n${m.url}`))
            }
        })
    } else {
        session.send('Que tipo de oportunidades você procura?')
    }
    
})
bot.dialog('/', intents)

