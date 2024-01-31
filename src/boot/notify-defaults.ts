import { boot } from 'quasar/wrappers'
import { Notify } from 'quasar'

export default boot(async () => {
  Notify.setDefaults({
    position: 'top-right'
  })
})
