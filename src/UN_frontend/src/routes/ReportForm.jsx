import React, { useState } from "react";
import "../../src/ReportForm.css"; // Importing CSS for styling
import Layout from "../components/Layout";
import { allCountries, getCountryStates } from "../helper/countries";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Center,
  FormControl,
  FormErrorMessage,
  Input,
  Select,
  Spinner,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import withAuth from "../lib/withAuth";
import { useIIClient } from "../hooks/useIIClient";
import { Link } from "react-router-dom";
import { Categories } from "../helper/enum";
import { useActor } from "../hooks/useActor";

const ReportForm = () => {
  const { actor } = useActor();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const categories = Categories

  function getExtension(fileName) {
    const lastIndex = fileName.lastIndexOf(".");
    if (lastIndex === -1) {
      return ""; // no extension found
    }
    return fileName.substring(lastIndex + 1).toLowerCase();
  }

  async function getBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        resolve(new Uint8Array(reader.result));
      };
      reader.onerror = reject;
    });
  }

  const { identity } = useIIClient();

  const formik = useFormik({
    initialValues: {
      country: "",
      state: "",
      category: "",
      details: "",
      image: null,
    },
    validationSchema: Yup.object({
      country: Yup.string().required("Required"),
      state: Yup.string().required("Required"),
      category: Yup.string().required("Required"),
      details: Yup.string()
        .min(30, "Minimum of 30 characters")
        .required("Required"),
      image: Yup.mixed()
        .required("Image is required")
        .test({
          message: "Please provide a supported file type",
          test: (file, context) => {
            const isValid = ["png", "jpg", "jpeg"].includes(
              getExtension(file?.name)
            );
            if (!isValid) context?.createError();
            return isValid;
          },
        })
        .test("fileSize", "The file is too large", (value) => {
          if (!value.size) return true;
          return value.size <= 3 * 1024 * 1024;
        }),
    }),
    onSubmit: async (values, { resetForm }) => {
      let imageBuffer = "";
      await getBuffer(values.image)
        .then((res) => {
          imageBuffer = res;
        })
        .catch((err) => {
          console.log(err);
          throw new Error("Base64 operation failed");
        });
      setIsLoading(true);
      try {
        const response = await actor.createReport(
          values.country,
          values.state,
          values.details,
          values.category,
          imageBuffer
        );
        console.log(response);
        if (response.ok === null) {
          toast({
            title: "Report created",
            description:
              "Your report has been filed successfully. Thanks for filing your report.",
            isClosable: true,
            position: "top",
            duration: 3000,
            status: "success",
          });
          resetForm();
        } else {
          toast({
            title: "Error creating report",
            description: response.err,
            isClosable: true,
            position: "top",
            duration: 3000,
            status: "error",
          });
        }
      } catch (e) {
        setIsLoading(false);
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="containerf">
      <Layout />
      <div className="form-container">
        <Link to="/coursePage" className="back-link">
          ← File Report
        </Link>
        <form className="report-form" onSubmit={formik.handleSubmit}>
          <FormControl className="form-group" isInvalid={formik.errors.country}>
            <label htmlFor="country">Country</label>
            <Select
              id="country"
              name="country"
              value={formik.values.country}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              _selected={{
                bg: "white !important",
              }}
            >
              <option style={{ background: "white" }} value={""}>
                Select your country
              </option>
              {allCountries
                .filter((country) => {
                  return country.region === "Africa";
                })
                .map((country, index) => (
                  <option
                    style={{ background: "white" }}
                    key={index}
                    value={country.code2}
                  >
                    {country.name}
                  </option>
                ))}
            </Select>
            <FormErrorMessage>{formik.errors.country}</FormErrorMessage>
          </FormControl>
          <FormControl className="form-group" isInvalid={formik.errors.state}>
            <label htmlFor="state">State</label>
            <Select
              id="state"
              name="state"
              value={formik.values.state}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option style={{ background: "white" }} value={""}>
                Select your state
              </option>
              {formik.values.country &&
                getCountryStates(formik.values.country).map((state, index) => (
                  <option style={{ background: "white" }} key={index} value={state.code}>
                    {state.name}
                  </option>
                ))}
            </Select>
            <FormErrorMessage>{formik.errors.state}</FormErrorMessage>
          </FormControl>
          <FormControl
            className="form-group"
            isInvalid={formik.errors.category}
          >
            <label htmlFor="category">Category</label>
            <Select
              id="category"
              name="category"
              value={formik.values.category}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option style={{ background: "white" }} value="">Please select...</option>
              {categories.map((item, index) => {
                return (
                  <option style={{ background: "white" }} key={index} value={item}>
                    {item}
                  </option>
                );
              })}
            </Select>
            <FormErrorMessage>{formik.errors.category}</FormErrorMessage>
          </FormControl>
          <FormControl className="form-group" isInvalid={formik.errors.details}>
            <label htmlFor="details">Details</label>
            <Textarea
              id="details"
              name="details"
              placeholder="Describe the issue"
              value={formik.values.details}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            <FormErrorMessage>{formik.errors.details}</FormErrorMessage>
          </FormControl>
          <FormControl className="form-group" isInvalid={formik.errors.image}>
            <label htmlFor="image-upload">Upload Image</label>
            <Input
              type="file"
              id="image-upload"
              name="image"
              accept=".png, .jpg, .jpeg"
              onChange={(event) => {
                formik.setFieldValue("image", event.currentTarget.files[0]);
              }}
              onBlur={formik.handleBlur}
            />
            <FormErrorMessage>{formik.errors.image}</FormErrorMessage>
          </FormControl>
          {isLoading && (
            <Center mb={3}>
              <Spinner />
            </Center>
          )}
          <button id="send-button" type="submit">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

const Page = withAuth(ReportForm);

export default Page;
