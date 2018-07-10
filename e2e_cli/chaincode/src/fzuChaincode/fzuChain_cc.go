package main

import (
	"github.com/hyperledger/fabric/core/chaincode/shim"
	"fmt"
	"github.com/hyperledger/fabric/protos/peer"
	"encoding/json"
	"bytes"
)

type fzuChain struct {
	
}

//申请身份事件结构
type applyIdentity struct {
	EventId string `json:"event_id"`            //事件id和类型
	EventType string `json:"event_type"`
	
	ApplicantId string `json:"applicant_id"`    //申请人id=hash（姓名+身份证）

	ApplyRole string `json:"apply_role"`        //申请人想要申请的身份
	ApplyMsg string `json:"apply_msg"`
	ApplyStatus string `json:"apply_status"`    //申请的中间状态
	ApplyResult string `json:"apply_result"`    //申请结果

	corCheckIdentityId string `json:"cor_check_identity_id"`    //申请身份事件对应的审批身份事件的id
}

//申请基金事件结构
type applyFund struct {
	EventId string `json:"event_id"`        //事件id和类型
	EventType string `json:"event_type"`

	ApplicantId string `json:"applicant_id"`          //申请人id=hash（姓名+身份证）
	
	FundType string `json:"fund_type"`      //申请资金类型
	FundMount string `json:"fund_mount"`    //申请金额数量
	ApplyStatus string `json:"apply_status"`    //申请状态
	ApplyResult string `json:"apply_result"`    //申请结果
	
	corCheckFundId string `json:"cor_check_fund_id"`     //申请资金事件对应的审批资金事件的id
}

//审批身份事件结构
type checkIdentity struct {
	EventId string `json:"event_id"`               //事件id和类型
	EventType string `json:"event_type"`

	ApproverId string `json:"approver_id"`         //审批人的id=hash（姓名+身份证）
	corApplyIdentityId string `json:"cor_apply_identity_id"`    //待审批事件的id

	CheckResult string `json:"check_result"`       //审批结果
}

//审批基金事件结构
type checkFund struct {
	EventId string `json:"event_id"`               //事件id和类型
	EventType string `json:"event_type"`

	ApproverId string `json:"approver_id"`         //审批人的id=hash（姓名+身份证）
	corApplyFundId string `json:"cor_apply_fund_id"`    //待审批事件的id

	CheckResult string `json:"check_result"`       //审批结果
}

//初始化不做任何操作
func (f *fzuChain) Init(stub shim.ChaincodeStubInterface) peer.Response {
	fmt.Println("init starts successfully ------------ !!!!")
	return shim.Success(nil)
}

/*
	读取函数名称和参数列表,在这里先不传参数
 */
func (f *fzuChain) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	funcName, args := stub.GetFunctionAndParameters()
	fmt.Println()
	fmt.Println("Invoke is running:  " + funcName + "  function ------!!!!!")
	fmt.Println()

	//判断执行什么操作
	if funcName == "addEvent" {
		return f.addEvent(stub, args)
	} else if funcName == "getEvents" {
		return f.getEvents(stub, args)
	} else if funcName == "deleteEvent" {
		return f.deleteEvent(stub, args)
	} else if funcName == "getEventsByRange" {
		return f.getEventsByRange(stub, args)
	} else if funcName == "changeApplyStatus" {
		return f.changeApplyStatus(stub, args)
	}

	fmt.Printf("%s invocation error", funcName)
	return shim.Error("receive unknown function")
}

/*
	添加事件
 */
func (f *fzuChain) addEvent(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	eventId := args[0]     //事件id
	eventType := args[1]	//事件参数

	//先判断事件存不存在
	eventExists, err := stub.GetState(eventId)
	if err != nil {
		return shim.Error("Fail to get users: " + err.Error())
	} else if eventExists != nil {
		return shim.Error("the event has already exsits" + eventId)
	}

	/*
		申请身份
	*/
	if eventType == "applyIdentity" {
		applicantId := args[2]
		applyRole := args[3]
		msg := args[4]
		status := args[5]
		result := args[6]
		corCheckIdentityId := args[7]

		eventObject := &applyIdentity{eventId, eventType, applicantId, applyRole, msg, status, result, corCheckIdentityId }
		eventJSONAsbytes, err := json.Marshal(eventObject)

		if err != nil {
			return shim.Error(err.Error())
		}

		fmt.Println("eventId is -------" + eventId)
		fmt.Println()

		fmt.Printf("eventObject is -------%x------- ", eventJSONAsbytes)
		fmt.Println()
		err = stub.PutState(eventId, eventJSONAsbytes)
		if err != nil {
			return shim.Error(err.Error())
		}

	/*
		申请资金
	*/
	} else if eventType == "applyFund" {
		applicantId := args[2]
		fundType := args[3]
		fundMOunt := args[4]
		status := args[5]
		result := args[6]
		corCheckFundId := args[7]

		eventObject := &applyFund{eventId, eventType, applicantId, fundType, fundMOunt, status, result, corCheckFundId}
		eventJSONAsbytes, err := json.Marshal(eventObject)

		if err != nil {
			return shim.Error(err.Error())
		}

		fmt.Println()
		fmt.Println("eventId is -------" + eventId)
		fmt.Println()

		fmt.Printf("eventObject is -------%x------- ", eventJSONAsbytes)

		err = stub.PutState(eventId, eventJSONAsbytes)
		if err != nil {
			return shim.Error(err.Error())
		}

	/*
		审批身份
	*/
	} else if eventType == "checkIdentity" {
		approverId := args[2]
		corApplyIdentityId := args[3]
		result := args[4]

		eventObject := &checkIdentity{eventId, eventType, approverId, corApplyIdentityId, result}
		eventJSONAsbytes, err := json.Marshal(eventObject)

		if err != nil {
			return shim.Error(err.Error())
		}

		fmt.Println("eventId is -------" + eventId)
		fmt.Println()

		fmt.Printf("eventObject is -------%x------- ", eventJSONAsbytes)

		err = stub.PutState(eventId, eventJSONAsbytes)
		if err != nil {
			return shim.Error(err.Error())
		}

	/*
		审批资金
	 */
	} else if eventType == "checkFund" {
		approverId := args[2]
		corApplyFundId := args[3]
		result := args[4]

		eventObject := &checkIdentity{eventId, eventType, approverId, corApplyFundId, result}
		eventJSONAsbytes, err := json.Marshal(eventObject)

		if err != nil {
			return shim.Error(err.Error())
		}

		fmt.Println("eventId is -------" + eventId)
		fmt.Println()

		fmt.Printf("eventObject is -------%x------- ", eventJSONAsbytes)

		err = stub.PutState(eventId, eventJSONAsbytes)
		if err != nil {
			return shim.Error(err.Error())
		}
	}
	return shim.Success(nil)
}

/*
	获取单个事件，配合for循环构成getEvents函数
 */
func (f *fzuChain) getEvent(stub shim.ChaincodeStubInterface, args string) peer.Response {
	eventId := args              //只传入一个参数

	eventBytes, err := stub.GetState(eventId)
	if err != nil {
		return shim.Error(err.Error())
	} else if eventBytes == nil {
		return shim.Error("the event does not exist--------!!!")
	}

	fmt.Println("successfully get the event " + eventId + "------!!!!")
	fmt.Printf("the event message is -----%x------", eventBytes)
	fmt.Println("-----------------")
	fmt.Println()

	return shim.Success(eventBytes)
}

/*
	获取多个事件的信息，由用户输入想要查询的事件id
	参数列表："Args":["getEvents", "a1", "b1"]
 */
func (f *fzuChain) getEvents(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	slice1 := args[0:]            //从参数开始读取，生成切片
	slicelength := len(slice1)

	for i := 0; i < slicelength; i++ {
		f.getEvent(stub, slice1[i])
	}

	return shim.Success(nil)
}


/*
	删除事件
 */
func (f *fzuChain) deleteEvent(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	eventId := args[0]

	eventBytes, err := stub.GetState(eventId)
	if err != nil {
		return shim.Error(err.Error())
	} else if eventBytes == nil {
		return shim.Error("the event does not exist--------!!!")
	}

	err = stub.DelState(eventId)
	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("successfully delete the event: " + eventId + "-------!!!!")
	return shim.Success(nil)
}

/*
	可以获取多个event的内容（按顺序获取）
	参数列表："Args":["getEventsByRange", "a1", "d1"],获取a1、b1、c1的内容
 */
func (f *fzuChain) getEventsByRange(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	startKey := args[0]
	endKey := args[1]

	resultsIterator, err := stub.GetStateByRange(startKey, endKey)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	isWritten := false
	for resultsIterator.HasNext() {
		queryResp, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		queryResultKey := queryResp.Key
		queryResultValue := queryResp.Value

		if isWritten == true {
			buffer.WriteString(",")
		}

		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResultKey)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResultValue))
		buffer.WriteString("}")
		isWritten = true
	}

	buffer.WriteString("]")

	fmt.Printf("getEventsByRange queryResult:------------\n%s\n", buffer.String())
	return shim.Success(buffer.Bytes())
}

/*
	改变事件中某个字段的值
*/
func (f *fzuChain) changeApplyStatus(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	eventId := args[0]
	eventType := args[1]
	newValue := args[2]

	//先判断事件存不存在
	eventABytes, err := stub.GetState(eventId)
	if err != nil {
		return shim.Error(err.Error())
	} else if eventABytes == nil {
		fmt.Println("the event does not exist")
	}

	res1 := &applyIdentity{}
	res2 := &applyFund{}

	if eventType == "applyIdentity" {
		json.Unmarshal(eventABytes, &res1)
		res1.ApplyStatus = newValue

		eventObject, _:= json.Marshal(res1)
		if err != nil {
			return shim.Error(err.Error())
		}

		err = stub.PutState(eventId, eventObject)
		if err != nil {
			return shim.Error(err.Error())
		}

	} else if eventType == "applyFund" {
		json.Unmarshal(eventABytes, &res2)
		res2.ApplyStatus = newValue

		eventObject, _:= json.Marshal(res2)

		err = stub.PutState(eventId, eventObject)
		if err != nil {
			return shim.Error(err.Error())
		}
	}

	fmt.Println("changeValue successfully---------!!!!")
	return shim.Success(nil)
}

func main() {
	err := shim.Start(new(fzuChain))
	if err != nil {
		fmt.Println("fzuchain starts error!!!")
	}
}


