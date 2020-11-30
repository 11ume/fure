export default {
    cache: false
    , timeout: '1m'
    , concurrency: 6
    , babel: {
        compileEnhancements: false
    }
    , files: [
        '!dev'
        , '!test/healpers'
    ]
    , require: ['ts-node/register']
    , extensions: ['ts']
}
