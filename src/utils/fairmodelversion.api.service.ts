import getClient from "./client"

const client = getClient()

export const fairmodelVersionApiService = {
    index(fairmodel_id: string, filter: object) {
        return client.get(`/model/${fairmodel_id}/version`, {'params': filter})
    },

    create(fairmodel_id: string, data: {update_description: string, update_type: string}) {
        return client.post(`/model/${fairmodel_id}/version`, data);
    },

    get(fairmodel_id: string, version_id: string) {
        return client.get(`/model/${fairmodel_id}/version/${version_id}`);
    },

    update(fairmodel_id: string, version_id: string, data: {name: string, description: string}) {
        return client.put(`/model/${fairmodel_id}/version/${version_id}`,  data);
    },

    delete(fairmodel_id: string, version_id: string) {
        return client.delete(`/model/${fairmodel_id}/version/${version_id}`)
    }
}