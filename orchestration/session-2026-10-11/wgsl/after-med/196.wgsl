// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform1 : f32,
	nodeUniform5 : mat3x3<f32>
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform3 : vec3<f32>,
	nodeUniform7 : vec3<f32>,
	nodeUniform2 : vec3<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : f32;
var<private> Output : vec4<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar1 : f32;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : vec3<f32>;
var<private> nodeVar5 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar6 : vec4<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar7 : vec3<f32>;
var<private> nodeVar8 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar9 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar10 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar11 : vec3<f32>;
var<private> nodeVar12 : vec4<f32>;

// codes


@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = clamp( ( ( v_positionWorld.y - 9.9 ) / 10.0 ), 0.0, 1.0 );
	DiffuseColor = vec4<f32>( mix( vec3<f32>( 0.012, 0.012, 0.03 ), vec3<f32>( 0.05, 0.03, 0.06 ), ( nodeVar0 * nodeVar0 ) ), 1.0 );
	DiffuseColor.w = ( DiffuseColor.w * ( 1.0 * object.nodeUniform1 ) );
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalViewGeometry = normalize( v_normalViewGeometry );
	normalView = normalViewGeometry;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar1 = dot( normalWorld, normalize( render.nodeUniform7 ) );
	nodeVar2 = ( nodeVar1 * 0.5 );
	nodeVar3 = ( nodeVar2 + 0.5 );
	nodeVar4 = mix( render.nodeUniform2, render.nodeUniform3, nodeVar3 );
	nodeVar5 = ( irradiance + nodeVar4 );
	irradiance = nodeVar5;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	indirectDiffuse = vec4<f32>( 0.0, 0.0, 0.0, 0.0 ).xyz;
	nodeVar6 = ( vec4<f32>( indirectDiffuse, 1.0 ) + vec4<f32>( 1.0, 1.0, 1.0, 0.0 ) );
	indirectDiffuse = nodeVar6.xyz;
	ambientOcclusion = 1.0;
	nodeVar7 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar7;
	nodeVar8 = ( indirectDiffuse * DiffuseColor.xyz );
	indirectDiffuse = nodeVar8;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar9 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar9;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar10 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar10;
	nodeVar11 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar11;
	nodeVar12 = max( vec4<f32>( outgoingLight, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar12;

	// result

	output.color = nodeVar12;

	return output;

}
