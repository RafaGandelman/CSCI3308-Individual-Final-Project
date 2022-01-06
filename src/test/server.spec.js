// Imports the server.js file to be tested.
const server = require("src\server.js");
// Assertion (Test Driven Development) and Should,  Expect(Behaviour driven 
// development) library
const chai = require("chai");
// Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require("chai-http");
chai.should();
chai.use(chaiHttp);
const { assert, expect } = chai;

describe("Server!", () => {

    it("Loads Main Page",(done) => {
        chai
            .request(server)
            .get("/main")
            .end((err,res)=>{
                expect(res.body).to.have.property('my_title');
                expect(res.body).to.have.property('artist');
                expect(res.body).to.have.property('error');
                expect(res.body).to.have.property('search');
                expect(res.body).to.have.property('imageLink');
                expect(res.body).to.have.property('bandName');
                expect(res.body).to.have.property('link');
                expect(res.body).to.have.property('year');
                expect(res.body).to.have.property('genre');
                expect(res.body).to.have.property('bio');
                done();
            })
    });

    it("Loads Reviews Page",(done)=>{
        chai
            .request(server)
            .get("/reviews")
            .end((err,res)=>{
                expect(res.body).to.have.property('my_title');
                expect(res.body).to.have.property('data');
                done();
            })
    });
});