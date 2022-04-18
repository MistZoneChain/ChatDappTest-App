import { WebRequest, COMMON,log } from '../const'

export class API {
    private _debank: WebRequest;

    constructor() {
        this._debank = new WebRequest(COMMON.SERVICE_URL.DEBANK_API)
    }

    async getUSDValue(address: string): Promise<number> {
        try {
            const res = await this._debank.get(`/user/addr?addr=${address}`)
            if (res.error_code == 0) {
                return res.data.usd_value
            } else {
                log(res)
                return 0
            }
        } catch (error) {
            return 0
        }
    }
}