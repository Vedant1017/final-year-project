export function applyIdJson(schema) {
  schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    }
  });
}
