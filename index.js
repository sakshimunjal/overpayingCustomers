const express = require('express');
const axios = require('axios')
const app = express();

app.get('/api/exceptions', async(req,res,next)=>{
    let deptid = req.query.deptid
    let amount = req.query.amount
    let plantype = req.query.plantype

    if(!(!isNaN(parseInt(deptid)) && parseInt(deptid) >= 100 && parseInt(deptid) <= 999)){
        return res.status(500).json({
            "status": "error",
            "message": "Illegal value for deptid"
        })
    }

    if(isNaN(parseInt(amount))){
        return res.status(500).json({
            "status": "error",
            "message": "Illegal value for amount"
        })
    }

    var regEx = /[a-zA-Z]+/g
    let isPlanTypeValid = regEx.exec(plantype);
    if((isPlanTypeValid && isPlanTypeValid[0].length !== plantype.length) || !isPlanTypeValid){
        return res.status(500).json({
            "status": "error",
            "message": "Illegal value for plantype"
        })
    }

    Promise.all([await axios.get(`https://assessments.reliscore.com/api/billing/${deptid}/`),
                await axios.get('https://assessments.reliscore.com/api/customers/')
        ]).then(([billingApiResponse, customerApiResponse])=>{

            if(billingApiResponse.data.status === "error"){
                return res.status(500).send(billingApiResponse.data)
            }

            if(customerApiResponse.data.status === "error"){
                return res.status(500).send(customerApiResponse.data)
            }

            let billingData = billingApiResponse.data.data;
            let customerData = customerApiResponse.data.data

            

            let exceptions = [];
            let missing = [];

            Object.keys(customerData).forEach((custId)=>{
                if(customerData[custId] === plantype && billingData[custId] !== undefined && billingData[custId] > amount){
                    exceptions.push(custId)
                }
            });

            Object.keys(billingData).forEach((custId)=>{
                if(!customerData[custId]){
                    missing.push(custId)
                }
            });

            res.json({"status": "success", 
                        "data": {"exceptions": exceptions,
                     "missing": missing}
             })
        })
        .catch((err) =>{
            res.status(500).json({"status": "error",
            "message": "Something went wrong! " + err})
        })
    
})

app.listen(process.env.PORT ||3000)