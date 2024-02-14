export type User = {
  pk: number,
  username: string,
  email: string,
  first_name: string,
  last_name: string
}

export type Fairmodel = {
  id: string,
  name: string,
  description: string
  // created_at: string
}

export type FairmodelVersion = {
  id: string,
  fairmodel_id: Fairmodel['id'],
  version: string,
  has_model: boolean,
  metadata_id: string,
  metadata_json: JSON
  update_description: string,

  model_type: 'ONNX' | 'PMML'
  // created_at: string
}