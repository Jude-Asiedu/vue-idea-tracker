export class ConflictError extends Error {
  constructor(message = 'This item was changed elsewhere') {
    super(message)
    this.name = 'ConflictError'
  }
}
