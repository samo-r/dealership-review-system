import React from "react";
import CreateUserForm from "../../components/admin/CreateUserForm";

const CreateUser = () => (
  <CreateUserForm
    title="Add New User"
    description="Create a dealer admin and assign them to a dealership. Fresh dealership data is loaded on each visit."
  />
);

export default CreateUser;
