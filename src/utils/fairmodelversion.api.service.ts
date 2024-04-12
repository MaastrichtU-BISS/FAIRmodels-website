import { MetadataMappedLinks } from "src/types";
import { client } from "./client"

export const fairmodelVersionApiService = {
    index(fairmodel_id: string, filter: object) {
        return client.get(`/fairmodel/${fairmodel_id}/version`, {'params': filter})
    },

    create(fairmodel_id: string, data: {update_description: string, update_type: string}) {
        return client.post(`/fairmodel/${fairmodel_id}/version`, data);
    },

    get(fairmodel_id: string, version_id: string) {
        return client.get(`/fairmodel/${fairmodel_id}/version/${version_id}`);
    },

    update(fairmodel_id: string, version_id: string, data: {metadata_id: string}) {
        return client.put(`/fairmodel/${fairmodel_id}/version/${version_id}`,  data);
    },

    delete(fairmodel_id: string, version_id: string) {
        return client.delete(`/fairmodel/${fairmodel_id}/version/${version_id}`)
    },

    uploadModel(fairmodel_id: string, version_id: string, data: {model_type: 'ONNX' | 'PMML', file: File}) {
        return client.postForm(`/fairmodel/${fairmodel_id}/version/${version_id}/model`, {...data})
    },

    downloadModel(fairmodel_id: string, version_id: string) {
        return client.get(`/fairmodel/${fairmodel_id}/version/${version_id}/model`, { responseType: 'stream' })
    },

    getVariables(fairmodel_id: string, version_id: string) {
        return client.get(`/fairmodel/${fairmodel_id}/version/${version_id}/variables`)
    },

    saveLinks(fairmodel_id: string, version_id: string, links: {input: MetadataMappedLinks, output: MetadataMappedLinks}) {
        return client.put(`/fairmodel/${fairmodel_id}/version/${version_id}/variables`, {links})
    }
}