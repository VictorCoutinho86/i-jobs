require('dotenv-extended').load();
const builder = require('botbuilder');
const restify = require('restify');
const cognitive = require('botbuilder-cognitiveservices');
const server = restify.createServer();
const request = require('request');
const port = process.env.port || process.env.PORT || 3978;

// const url_busca = process.env.ENDPOINT_API;


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

/**
 * Default function
 * In case of Luis don't understand the sentence or if intent is understanded but not implemented in this program
 * @returns String = Sorry message for users
 */
intents.onDefault((session, args) => {
    console.log(JSON.stringify(args))
    session.send('Desculpe, não entendi sua solicitação!')
})

var saudou = false

/* function create_card(jobs, session) {
    console.log(job.titulo + ' ' + job.url)
    const oports = []
    jobs.forEach(job => {
        const card = new builder.HeroCard(session)
            .title(`${job.titulo}`)
            .subtitle(`${job.localidade}`)
            .images([
                builder.CardImage.create(session, `${job.img}`)
            ])
            .buttons([
                builder.CardAction.openUrl(session, `${job.url}`)
            ]);
        oports.push(card)
    })
    return oports;
} */
/**
 * Intent if user is looking for job
 * Luis looks if the sentence contaning the job for the person search
 * If exists, the function send to the endpoint for search on the internet
 * If not, ask users to say what jobs he search
 * @param funcao = String get by the Entities identify by Luis
 * @returns vagas = json with jobs match with funcao 
 */
intents.matches('oportunidades', (session, args, next) => {
    const funcao = builder.EntityRecognizer.findAllEntities(args.entities, 'funcao').map(m => m.entity).join(' ')
    if (funcao) {
        if (!saudou) {
            session.send("Tudo bem que eu sou só um robo, mas não custa dizer olá!")
        }
        const endpoint = `${process.env.ENDPOINT_API}${funcao}`
        setTimeout(function () {
            session.send('Aguarde enquanto busco as oportunidades.')
        }, 4000)
        request.get(endpoint, (error, response, body) => {
            if (error || !body) {
                console.log(error)
                return session.send('Ocorreu algum erro, tente novamente mais tarde.')
            } else {
                const vagas = JSON.parse(body);
                if (vagas.length < 1) {
                    return session.send(`Desculpe, mas não encontrei oportunidades para **${funcao}**`)
                }
                vagas.forEach(vaga => {
                    session.send(vagas.map(m => `${m.titulo} - ${m.localidade} \n${m.url}`))
                    setTimeout(function () {
                    }, 5000)

                });
            }

        })
    } else {
        session.send('Que tipo de oportunidades você procura?')
    }
})


intents.matches('cumprimento.formal', (session, args, next) => {
    saudou = true
    const saudar = builder.EntityRecognizer.findAllEntities(args.entities, 'saudar').map(m => m.entity).join('+')
    if (saudar) {
        if (saudar == 'bom+dia') { session.send(`Bom dia ${session.message.user.name}, em que posso lhe ajudar?`) }
        if (saudar == 'boa+tarde') { session.send(`Boa tarde ${session.message.user.name}, Em que posso ser útil?`) }
        if (saudar == 'boa+noite') { session.send(`Boa noite ${session.message.user.name}, posso lhe ajudar em algo?`) }
    } else {
        session.send(`Olá ${session.message.user.name}, eu sou um Bot buscador de vagas na internet!`)
        setTimeout(function () {
            session.send('O que você deseja procurar?')
        }, 3000)
        console.log(session.message.address.channelId)
    }
})


intents.matches('cumprimento.informal', (session, args, next) => {
    saudou = true
    session.send('De boa na lagoa!')
    setTimeout(() => {
        session.send(`Que tu manda ${session.message.user.name}?`)
    }, 3000);
})

intents.matches('brincadeiras', (session, args, next) => {
    if (!saudou) {
        session.send(`Engraçado é que nem um **olá** a pessoa dá!!`)
        session.send('Mas eu sou só um Bot, né!')
    }
    setTimeout(()=>{
        session.send('Eu ainda não aprendi isso!')
    }, 3000)
    setTimeout(()=>{
        session.send('Tem muita coisa pra aprender ainda!')
    }, 5000)

    /*setTimeout(() => {
        session.send('Eu só conheço charada, serve?', (session) => {
            if (session.message.text == 'sim' || session.message.text == 'Sim' ||
                session.message.text == 'SIM' || session.message.text == 'yes' ||
                session.message.text == 'ok' || session.message.text == 'OK' ||
                session.message.text == 'certo' || session.message.text == 'blz') {
                charada = {
                    url: 'https://us-central1-kivson.cloudfunctions.net/charada-aleatoria',
                    headers: 'application/json'
                }
                request.get(charada, (error, response, body) => {
                    if (error || !body) {
                        session.send('Não to lembrando de nenhuma charada boa hoje.')
                        setTimeout(() => {
                            session.send('Outro dia eu conto uma que vai te derrubar da cadeira!!')
                        }, 2000)
                    } else {
                        char = JSON.parse(body)
                        session.send(`${char.pergunta}`)
                        if (session.message.text != 'não quero saber') {
                            session.send(`${char.resposta}`)
                        } else {
                            session.send('Foi você quem pensou que eu não sabia brincar!')
                        }
                    }
                })
            }
        })
    }, 4000);*/
    
})

/* 
if (update.membersAdded) {
        update.membersAdded.forEach( (identity) => {
            if (identity.id === update.address.bot.id) {
                bot.loadSession(update.address, (err, session) => {
                    if(err)
                        return err
                    const message = `Olá ${update.address.bot.name}`
                    session.send(message)
                })
            }
        })
    }
*/

intents.matches('agradecimento', (session, args, next)=>{
    session.send("Por nada, espero ter ajudado!")
    setTimeout(()=>{
        session.send("Boa sorte!")
    }, 4000);
    session.endDialog()
})

bot.dialog('/', intents)
