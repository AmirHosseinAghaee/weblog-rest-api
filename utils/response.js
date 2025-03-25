exports.handleResponse = (res, Status, ContentData, message = null) => {
  const response = {
    Header: {
      Status,
      Message: message || messages(Status),
      MessageCode: 0,
    },
    ContentData: ContentData || null,
  };

  res.status(Status).json(response);
};

const messages = (status) => {
  switch (status) {
    case 200:
      return "Successful Operation";
    case 400:
      return "Bad Request";
    case 422:
      return "Invalid Request";
    case 404:
      return "Not Found";
    case 500:
      return "Server Error";
    default:
      return "Error";
  }
};
