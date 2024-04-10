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



export type ModelVariable = {
  name: string,
  type: Record<string, any> // any object
}
export type MetadataVariableLink = {
  name: ModelVariable['name'],
  linked_dim_start: number,
  linked_dim_end: number
}
export type MetadataVariable = {
  id: string,
  name: string,
  linked_model_var?: MetadataVariableLink
}
export type MetadataMappedLinks = {
  id: MetadataVariable['id'],
  link: MetadataVariableLink
}[]