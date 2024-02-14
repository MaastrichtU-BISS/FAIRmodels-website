import { client } from "./client"

export const fairmodelApiService = {
    index(filter: {owned: boolean}) {
        return client.get(`/fairmodel/`, {'params': filter})
    },

    create(data: {name: string, description: string}) {
        return client.post(`/fairmodel/`, data);
    },

    get(id: string) {
        return client.get(`/fairmodel/${id}`);
    },

    update(id: string, data: {name: string, description: string}) {
        return client.put(`/fairmodel/${id}`,  data);
    },

    delete(id: string) {
        return client.delete(`/fairmodel/${id}`)
    }
}